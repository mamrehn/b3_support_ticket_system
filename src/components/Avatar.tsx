// Runder Initialen-Avatar für Melder (neutral) und Kollegin (accent).
export function Avatar({
  name,
  tone = 'neutral',
}: {
  name: string;
  tone?: 'neutral' | 'accent';
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toneClass =
    tone === 'accent' ? 'bg-accent-600 text-white' : 'bg-gray-200 text-gray-700';

  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${toneClass}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
