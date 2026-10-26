// Tools the diagnostic agent can call, plus a deterministic safety triage that
// runs before the model sees the conversation.

// Small reference table of common codes (illustrative subset; expand as needed).
const ERROR_CODES = [
  { appliance: 'dishwasher', brand: 'whirlpool', code: 'F8E1', meaning: 'Drain/pump problem: water not draining.', fix: 'Clean the filter and drain hose; check the garbage disposal knockout plug.', diy: true },
  { appliance: 'dishwasher', brand: 'bosch', code: 'E24', meaning: 'Drain blockage or kinked drain hose.', fix: 'Clean the filter, check the hose for kinks, run the disposal.', diy: true },
  { appliance: 'dishwasher', brand: 'bosch', code: 'E15', meaning: 'Water in the base pan (leak detected).', fix: 'Unplug, shut off water, tip/dry the base; leak source usually needs a pro.', diy: false },
  { appliance: 'dishwasher', brand: 'ge', code: 'E1', meaning: 'Heater/thermistor fault.', fix: 'Power-cycle at the breaker for 5 minutes; if it returns, the part needs replacing.', diy: false },
  { appliance: 'washer_dryer', brand: 'lg', code: 'OE', meaning: 'Washer will not drain.', fix: 'Clean the drain pump filter (small door at bottom front) and check the drain hose.', diy: true },
  { appliance: 'washer_dryer', brand: 'lg', code: 'UE', meaning: 'Unbalanced load.', fix: 'Redistribute the load; make sure the washer is level.', diy: true },
  { appliance: 'washer_dryer', brand: 'samsung', code: '5C', meaning: 'Drain error.', fix: 'Clean the drain filter and hose.', diy: true },
  { appliance: 'washer_dryer', brand: 'whirlpool', code: 'F21', meaning: 'Long drain: water not leaving the drum.', fix: 'Clean the drain pump filter; check the drain hose.', diy: true },
  { appliance: 'refrigerator', brand: 'samsung', code: '22E', meaning: 'Freezer fan problem (often ice build-up).', fix: 'Unplug 24h to defrost; if it returns, the fan motor is failing.', diy: true },
  { appliance: 'refrigerator', brand: 'lg', code: 'ER FF', meaning: 'Freezer fan error.', fix: 'Defrost fully and check the fan for ice; replace the fan if it still fails.', diy: true },
  { appliance: 'refrigerator', brand: 'ge', code: 'H2O', meaning: 'Water filter needs replacing.', fix: 'Replace the filter and reset the indicator.', diy: true },
  { appliance: 'oven', brand: 'ge', code: 'F3', meaning: 'Oven temperature sensor open/shorted.', fix: 'Check the sensor probe connection; sensor replacement is a common DIY.', diy: true },
  { appliance: 'oven', brand: 'whirlpool', code: 'F1', meaning: 'Control board fault.', fix: 'Power-cycle at the breaker; persistent F1 needs a new board (pro).', diy: false },
  { appliance: 'oven', brand: 'frigidaire', code: 'F10', meaning: 'Runaway temperature.', fix: 'Turn off and let cool; call a pro if it repeats.', diy: false },
  { appliance: 'hvac', brand: 'any', code: 'E1', meaning: 'Often a frozen coil or pressure fault depending on the unit.', fix: 'Replace the filter and check the vents; refrigerant faults need a licensed pro.', diy: false },
  { appliance: 'water_heater', brand: 'rheem', code: '1 flash', meaning: 'Normal operation (some models).', fix: 'No action needed.', diy: true },
  { appliance: 'water_heater', brand: 'rheem', code: '4 flashes', meaning: 'Water temperature too high/ECO tripped.', fix: 'Turn the heater off; reset the ECO. If it trips again, call a pro.', diy: false },
];

// Typical cost ranges (USD), rough US averages.
const COSTS = {
  dishwasher: { diy: '$0-$40 (filter, hose clamp, spray arm)', pro: '$150-$400', replace: '$500-$1,200' },
  refrigerator: { diy: '$0-$60 (coil cleaning, gasket, fan)', pro: '$200-$600', replace: '$900-$2,500' },
  washer_dryer: { diy: '$0-$80 (drain filter, belt, vent clean)', pro: '$150-$450', replace: '$600-$1,500' },
  oven: { diy: '$20-$100 (igniter, sensor, element)', pro: '$150-$450', replace: '$700-$2,500' },
  hvac: { diy: '$10-$40 (filter, drain line flush)', pro: '$150-$600 (refrigerant work $300+)', replace: '$5,000-$12,000' },
  water_heater: { diy: '$20-$60 (anode, thermostat, element)', pro: '$200-$600', replace: '$1,200-$3,500' },
};

export const TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'lookup_error_code',
      description: 'Look up an appliance error code in the reference table. Call this whenever the user mentions an error code or blinking-light pattern, instead of guessing its meaning.',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand if known, e.g. Bosch, LG. Use "any" if unknown.' },
          code: { type: 'string', description: 'The exact code, e.g. E24 or F8E1.' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_repair_cost',
      description: 'Get typical DIY, professional-repair and replacement cost ranges for this appliance. Call this before recommending a pro, so the recommendation compares real numbers.',
      parameters: {
        type: 'object',
        properties: {
          appliance_age_years: { type: 'number', description: 'Approximate age in years, if known.' },
        },
      },
    },
  },
];

export function runTool(name, args, category) {
  if (name === 'lookup_error_code') {
    const code = String(args.code || '').trim().toLowerCase().replace(/\s+/g, '');
    const brand = String(args.brand || 'any').trim().toLowerCase();
    const rows = ERROR_CODES.filter(r =>
      r.appliance === category && r.code.toLowerCase().replace(/\s+/g, '') === code);
    if (rows.length === 0) {
      return { found: false, note: 'Code not in reference table. Do NOT invent a meaning; ask for make/model and say you are not certain what this code means.' };
    }
    const exact = rows.find(r => r.brand === brand) || rows[0];
    return { found: true, ...exact, brand_match: exact.brand === brand || exact.brand === 'any' };
  }
  if (name === 'estimate_repair_cost') {
    const c = COSTS[category];
    if (!c) return { found: false };
    const age = Number(args.appliance_age_years);
    const note = Number.isFinite(age) && age >= 10
      ? 'Appliance is 10+ years old: if the pro repair is over about half the replacement cost, recommend considering replacement.'
      : 'If the pro repair is over about half the replacement cost, consider replacement.';
    return { found: true, ...c, note };
  }
  return { error: `Unknown tool ${name}` };
}

// Deterministic first-line safety triage. Runs on the latest user message
// before the model call and injects a hard instruction when it fires.
const HAZARDS = [
  { id: 'gas', re: /(smell|smells|smelling|odor).{0,25}(gas|rotten egg|sulfur)|gas (leak|smell)|hissing.{0,20}gas/i,
    instruction: 'SAFETY ALERT (gas): Tell the user to leave the home now, not to use switches or phones inside, and to call the gas utility or 911 from outside. Do NOT diagnose further. Do NOT output a FIX block.' },
  { id: 'electrical', re: /(burning|burnt|smoke|smoking).{0,25}(smell|smells|plastic|wire|outlet|electrical)|sparks?|sparking|shock(ed)?|electrocut/i,
    instruction: 'SAFETY ALERT (electrical/fire): Tell the user to switch off the breaker and unplug if safe, stay clear, and call a licensed pro (911 if there is fire or smoke). Output a PRO block with urgency "urgent". Do NOT output a FIX block.' },
  { id: 'water_electric', re: /(water|leak|flood|puddle).{0,30}(outlet|electrical|breaker|panel)|(outlet|breaker|panel).{0,30}(wet|water|flood)/i,
    instruction: 'SAFETY ALERT (water near electricity): Tell the user to turn off power at the breaker before going near the water. Do not give any DIY steps until the power is off.' },
  { id: 'co', re: /carbon monoxide|\bCO (alarm|detector)\b|co detector/i,
    instruction: 'SAFETY ALERT (carbon monoxide): Tell the user to get everyone outside into fresh air and call 911 or the gas utility. Do NOT diagnose further.' },
];

export function safetyTriage(lastUserText) {
  const hit = HAZARDS.find(h => h.re.test(lastUserText || ''));
  return hit ? { hazard: hit.id, instruction: hit.instruction } : null;
}
