import { useId } from 'react';
import { useService } from '../model/useService';

const OPTIONS = [
  { value: 'bicimad', label: 'BiciMAD' },
  { value: 'bus', label: 'Bus' },
] as const;

// Native radios, like the source picker they take over from: the arrow keys move between them.
export function ServiceToggle() {
  const [service, setService] = useService();
  const name = useId();

  return (
    <fieldset className="inline-flex self-start rounded-control border border-line-strong bg-surface p-0.5">
      <legend className="sr-only">Servicio</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === service}
            onChange={() => setService(option.value)}
            className="peer sr-only"
          />
          <span className="flex min-h-11 min-w-11 cursor-pointer items-center rounded-control px-4 font-medium text-fg-muted peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:bg-chip peer-checked:hover:bg-primary">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
