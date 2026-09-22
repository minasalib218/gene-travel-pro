import Image from "next/image";

type Props = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export default function GeneLogo({
  className = "",
  imageClassName = "h-auto w-[118px] sm:w-[148px] lg:w-[200px]",
  priority = false,
}: Props) {
  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/images/logo.png"
        alt="Gene Travel"
        width={200}
        height={200}
        priority={priority}
        className={imageClassName}
      />
    </span>
  );
}
