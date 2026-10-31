interface CharacterPortraitProps {
  name: string;
  thumbnail: string | null;
  size: number;
  imageClassName: string | undefined;
  fallbackClassName: string | undefined;
}

export function CharacterPortrait({
  name,
  thumbnail,
  size,
  imageClassName,
  fallbackClassName,
}: CharacterPortraitProps) {
  if (!thumbnail) {
    return <span className={fallbackClassName}>{name.charAt(0)}</span>;
  }

  return (
    <img
      className={imageClassName}
      src={thumbnail}
      alt={name}
      width={size}
      height={size}
    />
  );
}
