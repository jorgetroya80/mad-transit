import { expectNoAxeViolations } from './axe';

function containerWith(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

afterEach(() => document.body.replaceChildren());

describe('expectNoAxeViolations', () => {
  it('passes for a button with an accessible name', async () => {
    const container = containerWith('<button type="button">Sacar bici</button>');

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });

  it('fails with the rule id, help and target of an empty button', async () => {
    const container = containerWith('<button type="button" id="empty"></button>');

    await expect(expectNoAxeViolations(container)).rejects.toThrow(
      /button-name: Buttons must have discernible text\n {2}#empty/,
    );
  });
});
