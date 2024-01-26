import SvgIcon from "@mui/joy/SvgIcon";

export function FlagEnGb() {
  return (
    <SvgIcon>
      <rect fill="#012169" height={24} width={24} x={0} y={0} />
      <path
        d="M 0 0 L 24 24 M 24 0 L 0 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={4}
      />
      <path
        d="M -0.5 0.5 L 11.5 12.5 M 23.5 -0.5 L 11.5 11.5 M 24.5 23.5 L 12.5 11.5 M 0.5 24.5 L 12.5 12.5"
        fill="none"
        stroke="#C8102E"
        strokeWidth={2}
      />
      <path
        d="M 12 0 L 12 24 M 0 11 L 24 11 M 0 13 L 24 13"
        fill="none"
        stroke="#ffffff"
        strokeWidth={5}
      />
      <path
        d="M 12 0 L 12 24 M 0 11 L 24 11 M 0 13 L 24 13"
        fill="none"
        stroke="#C8102E"
        strokeWidth={3}
      />
    </SvgIcon>
  );
}
