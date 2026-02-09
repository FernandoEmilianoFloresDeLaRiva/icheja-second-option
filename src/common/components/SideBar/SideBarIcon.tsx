interface SideBarIconProps {
  iconName?: string;
  size?: number;
  logoSrc?: string;
  isCollapsed: boolean;
  altText?: string;
}

export default function SideBarIcon({
  iconName,
  size = 20,
  logoSrc,
  isCollapsed,
  altText = "Icon",
}: SideBarIconProps) {
  return (
    <div
      className="rounded flex gap-4 items-center text-xs font-bold"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={logoSrc}
        alt={altText}
        width={size}
        height={size}
        className="object-contain "
      />
      {!isCollapsed && iconName && iconName.trim() !== "" && (
        <p>{iconName?.toUpperCase()}</p>
      )}
    </div>
  );
}
