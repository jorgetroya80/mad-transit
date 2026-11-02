import axe, { type Result } from 'axe-core';

// jsdom computes no colors; contrast is already checked against the theme tokens.
const RUN_OPTIONS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

function describeViolation({ id, help, nodes }: Result) {
  const targets = nodes.map((node) => `  ${node.target.join(' ')}`);
  return [`${id}: ${help}`, ...targets].join('\n');
}

export async function expectNoAxeViolations(container: Element) {
  const { violations } = await axe.run(container, RUN_OPTIONS);
  if (violations.length === 0) return;
  throw new Error(violations.map(describeViolation).join('\n'));
}
