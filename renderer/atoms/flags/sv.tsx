import SvgIcon from "@mui/joy/SvgIcon";

export function FlagSv() {
  return (
    <SvgIcon>
      <rect fill="#006AA7" height={24} width={24} x={0} y={0} />
      <path
        d="M 9 0 L 9 24 M 0 12 L 24 12"
        fill="none"
        stroke="#FECC02"
        strokeWidth={4}
      />
    </SvgIcon>
  );
}
