import brandIcon from '@/assets/images/logo/LOGO_BLUFFING_ICON_Y_512.png';

type ClockBrandMarkProps = {
  /** Tailwind size classes; scales with the viewport so it reads on phone and TV alike. */
  className?: string;
  withWordmark?: boolean;
};

export function ClockBrandMark({ className, withWordmark = false }: ClockBrandMarkProps) {
  return (
    <span className="flex items-center gap-[0.6em]">
      <img
        src={brandIcon}
        alt="Bluffing Coffee"
        className={className ?? 'h-[clamp(2rem,5vw,4.5rem)] w-auto'}
        draggable={false}
      />
      {withWordmark ? (
        <span className="text-[clamp(1.1rem,3vw,2.4rem)] font-bold tracking-wide text-brand">
          Bluffing Coffee
        </span>
      ) : null}
    </span>
  );
}
