import { cn } from "@/lib/cn";

/**
 * <Kalding mood="..." />: the goat mascot, drawn as inline SVG.
 *
 * Palette (from the brief): cream face #F3EBDD, darker cream ears/snout #E4D8C3,
 * brown horns #8B6B4A, dark hoof/nose #6B5B45, goat-style horizontal pupils.
 *
 * The artwork is built from small shared parts (head, eyes, mouths, extras) so
 * every mood stays consistent. If you later drop hand-made SVGs into
 * public/kalding/, only the drawing inside this file needs to change; the
 * `mood` API stays the same.
 */

export type KaldingMood =
  "neutral" | "happy" | "oops" | "celebrate" | "streak" | "thinking" | "body";

const C = {
  cream: "#F3EBDD",
  creamDark: "#E4D8C3",
  horn: "#8B6B4A",
  dark: "#6B5B45",
  pupil: "#2B2118",
  eyeWhite: "#FFFDF7",
  blush: "#F2A99B",
  mouthInside: "#5A3A32",
  tongue: "#E88A8A",
};

const EYE_L = { x: 72, y: 98 };
const EYE_R = { x: 128, y: 98 };

/** Open eye with a horizontal (goat) pupil. `look` shifts the pupil. */
function OpenEye({
  cx,
  cy,
  lookX = 0,
  lookY = 0,
}: {
  cx: number;
  cy: number;
  lookX?: number;
  lookY?: number;
}) {
  return (
    <g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={14}
        ry={12}
        fill={C.eyeWhite}
        stroke={C.dark}
        strokeWidth={2}
      />
      <rect
        x={cx - 8 + lookX}
        y={cy - 3.5 + lookY}
        width={16}
        height={7}
        rx={3.5}
        fill={C.pupil}
      />
      <circle cx={cx - 4 + lookX} cy={cy - 1.2 + lookY} r={1.4} fill="#fff" />
    </g>
  );
}

/** Happy "^" eye, used when celebrating. */
function JoyEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx - 12} ${cy + 4} Q${cx} ${cy - 13} ${cx + 12} ${cy + 4}`}
      fill="none"
      stroke={C.pupil}
      strokeWidth={4.5}
      strokeLinecap="round"
    />
  );
}

function Brow({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={C.dark} strokeWidth={4} strokeLinecap="round" />;
}

function Blush() {
  return (
    <g fill={C.blush} opacity={0.6}>
      <ellipse cx={50} cy={121} rx={10} ry={5.5} />
      <ellipse cx={150} cy={121} rx={10} ry={5.5} />
    </g>
  );
}

function Mouth({ mood }: { mood: KaldingMood }) {
  switch (mood) {
    case "happy":
      return (
        <g>
          <path d="M87 146 Q100 168 113 146 Z" fill={C.mouthInside} />
          <path d="M93 155 Q100 162 107 155 Q100 150 93 155 Z" fill={C.tongue} />
          <path
            d="M87 146 Q100 168 113 146"
            fill="none"
            stroke={C.dark}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
      );
    case "celebrate":
      return (
        <g>
          <path d="M84 144 Q100 176 116 144 Z" fill={C.mouthInside} />
          <path d="M91 158 Q100 168 109 158 Q100 151 91 158 Z" fill={C.tongue} />
          <path
            d="M84 144 Q100 176 116 144 Z"
            fill="none"
            stroke={C.dark}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
      );
    case "oops":
      return (
        <path
          d="M88 156 Q94 148 100 154 Q106 160 112 152"
          fill="none"
          stroke={C.dark}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      );
    case "thinking":
      return (
        <path
          d="M91 154 Q101 150 111 154"
          fill="none"
          stroke={C.dark}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      );
    case "streak":
      return (
        <path
          d="M87 148 Q100 162 113 148"
          fill="none"
          stroke={C.dark}
          strokeWidth={4}
          strokeLinecap="round"
        />
      );
    default:
      return (
        <path
          d="M91 150 Q100 157 109 150"
          fill="none"
          stroke={C.dark}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      );
  }
}

function Eyes({ mood }: { mood: KaldingMood }) {
  if (mood === "celebrate") {
    return (
      <>
        <JoyEye cx={EYE_L.x} cy={EYE_L.y} />
        <JoyEye cx={EYE_R.x} cy={EYE_R.y} />
      </>
    );
  }
  const look =
    mood === "thinking"
      ? { lookX: 4, lookY: -4 }
      : mood === "oops"
        ? { lookX: 0, lookY: 2 }
        : { lookX: 0, lookY: 0 };
  return (
    <>
      <OpenEye cx={EYE_L.x} cy={EYE_L.y} {...look} />
      <OpenEye cx={EYE_R.x} cy={EYE_R.y} {...look} />
    </>
  );
}

function Brows({ mood }: { mood: KaldingMood }) {
  switch (mood) {
    case "oops": // worried: inner ends high
      return (
        <>
          <Brow d="M56 82 L86 72" />
          <Brow d="M144 82 L114 72" />
        </>
      );
    case "streak": // determined: inner ends low
      return (
        <>
          <Brow d="M56 72 L86 82" />
          <Brow d="M144 72 L114 82" />
        </>
      );
    case "thinking": // one raised brow
      return (
        <>
          <Brow d="M58 80 L84 80" />
          <Brow d="M116 76 Q130 62 144 72" />
        </>
      );
    default:
      return null;
  }
}

/** Mood-specific decoration around the head. All of it stays inside the 200x200 box. */
function Extras({ mood }: { mood: KaldingMood }) {
  switch (mood) {
    case "oops":
      return (
        <path
          d="M162 46 Q173 62 162 72 Q151 62 162 46 Z"
          fill="#8EC9F5"
          stroke="#4C9ED6"
          strokeWidth={1.5}
        />
      );
    case "celebrate":
      return (
        <g>
          <rect
            x={14}
            y={28}
            width={10}
            height={5}
            rx={1.5}
            fill="#F59E0B"
            transform="rotate(-30 19 30)"
          />
          <circle cx={182} cy={30} r={5} fill="#22A06B" />
          <rect
            x={176}
            y={150}
            width={10}
            height={5}
            rx={1.5}
            fill="#60A5FA"
            transform="rotate(35 181 152)"
          />
          <circle cx={16} cy={150} r={4.5} fill="#F472B6" />
          <path d="M24 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FACC15" />
          <path
            d="M176 84 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z"
            fill="#FB923C"
          />
          <rect
            x={32}
            y={178}
            width={9}
            height={5}
            rx={1.5}
            fill="#A78BFA"
            transform="rotate(20 36 180)"
          />
        </g>
      );
    case "streak":
      return (
        <g transform="translate(164 4)">
          <path
            d="M15 0 C21 12 31 18 31 30 C31 38 24 43 16 43 C7 43 0 38 0 29 C0 20 8 15 10 6 C12 9 14 9 15 0 Z"
            fill="#F97316"
          />
          <path
            d="M16 18 C20 24 23 27 23 32 C23 37 20 40 16 40 C12 40 9 37 9 32 C9 27 13 24 16 18 Z"
            fill="#FCD34D"
          />
        </g>
      );
    case "thinking":
      return (
        <g>
          <circle
            cx={158}
            cy={52}
            r={3}
            fill={C.creamDark}
            stroke={C.dark}
            strokeWidth={1.5}
          />
          <circle
            cx={168}
            cy={40}
            r={4.5}
            fill={C.creamDark}
            stroke={C.dark}
            strokeWidth={1.5}
          />
          <ellipse
            cx={178}
            cy={19}
            rx={18}
            ry={12}
            fill="#fff"
            stroke={C.dark}
            strokeWidth={2}
          />
          <circle cx={170} cy={19} r={2} fill={C.dark} />
          <circle cx={178} cy={19} r={2} fill={C.dark} />
          <circle cx={186} cy={19} r={2} fill={C.dark} />
        </g>
      );
    default:
      return null;
  }
}

/** Front-facing head in a 200x200 box. Reused by the body variant. */
function Head({ mood }: { mood: KaldingMood }) {
  const showBlush = mood === "happy" || mood === "celebrate" || mood === "streak";
  return (
    <g>
      {/* Horns (behind everything). Right horn is the left one mirrored. */}
      <g fill={C.horn}>
        <path d="M74 60 C56 54 42 34 50 10 C60 24 74 30 92 38 Z" />
        <g transform="translate(200 0) scale(-1 1)">
          <path d="M74 60 C56 54 42 34 50 10 C60 24 74 30 92 38 Z" />
        </g>
      </g>
      <g
        stroke={C.dark}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      >
        <path d="M58 44 Q66 46 74 44" />
        <path d="M54 30 Q60 33 68 32" />
        <path d="M142 44 Q134 46 126 44" />
        <path d="M146 30 Q140 33 132 32" />
      </g>

      {/* Ears */}
      <g fill={C.creamDark}>
        <ellipse cx={34} cy={94} rx={27} ry={12} transform="rotate(-18 34 94)" />
        <ellipse cx={166} cy={94} rx={27} ry={12} transform="rotate(18 166 94)" />
      </g>
      <g fill={C.cream} opacity={0.7}>
        <ellipse cx={36} cy={94} rx={17} ry={5.5} transform="rotate(-18 36 94)" />
        <ellipse cx={164} cy={94} rx={17} ry={5.5} transform="rotate(18 164 94)" />
      </g>

      {/* Beard */}
      <path
        d="M90 164 Q100 168 110 164 Q108 182 100 190 Q92 182 90 164 Z"
        fill={C.creamDark}
      />

      {/* Face */}
      <path
        d="M100 40 C142 40 164 70 160 108 C157 140 132 168 100 168 C68 168 43 140 40 108 C36 70 58 40 100 40 Z"
        fill={C.cream}
      />
      {/* Forelock */}
      <path d="M90 44 Q100 24 110 44 Q100 38 90 44 Z" fill={C.creamDark} />

      {/* Snout and nose */}
      <ellipse cx={100} cy={137} rx={34} ry={24} fill={C.creamDark} />
      <ellipse cx={90} cy={128} rx={4.5} ry={3.2} fill={C.dark} />
      <ellipse cx={110} cy={128} rx={4.5} ry={3.2} fill={C.dark} />

      {showBlush && <Blush />}
      <Eyes mood={mood} />
      <Brows mood={mood} />
      <Mouth mood={mood} />
      <Extras mood={mood} />
    </g>
  );
}

function HoofLeg({
  x,
  top,
  bottom,
  color,
}: {
  x: number;
  top: number;
  bottom: number;
  color: string;
}) {
  return (
    <g>
      <path
        d={`M${x} ${top} L${x} ${bottom}`}
        stroke={color}
        strokeWidth={19}
        strokeLinecap="round"
      />
      <rect x={x - 10} y={bottom - 2} width={20} height={11} rx={4.5} fill={C.dark} />
    </g>
  );
}

/** Full-body variant: cute, chubby chibi goat standing with hooves. */
function BodyArt({ mood = "happy" }: { mood?: KaldingMood }) {
  return (
    <g>
      {/* Soft ground shadow */}
      <ellipse cx={100} cy={206} rx={56} ry={7} fill="currentColor" opacity={0.12} />

      {/* Little curly goat tail */}
      <path
        d="M152 162 C164 150 172 156 166 168 C162 174 156 172 150 170 Z"
        fill={C.creamDark}
      />

      {/* Back legs (darker, behind body) */}
      <HoofLeg x={66} top={168} bottom={204} color={C.creamDark} />
      <HoofLeg x={134} top={168} bottom={204} color={C.creamDark} />

      {/* Chubby chibi body right under head */}
      <ellipse cx={100} cy={162} rx={54} ry={36} fill={C.cream} />
      <ellipse cx={100} cy={168} rx={36} ry={22} fill={C.creamDark} opacity={0.55} />

      {/* Front legs: planted neatly in front */}
      <HoofLeg x={84} top={172} bottom={204} color={C.cream} />
      <HoofLeg x={116} top={172} bottom={204} color={C.cream} />

      {/* Head: proportional and cute, resting comfortably on the body */}
      <g transform="translate(10 -6) scale(0.9)">
        <Head mood={mood === "body" ? "happy" : mood} />
      </g>
    </g>
  );
}

export type KaldingProps = {
  mood?: KaldingMood;
  /** Custom image source override (e.g. "/kalding/my-mascot.png") */
  src?: string;
  /** Rendered width in px. Height follows the artwork's aspect ratio. */
  size?: number;
  className?: string;
  /** Accessible name. Omit when the mascot is purely decorative (the default). */
  title?: string;
};

export function Kalding({
  mood = "neutral",
  size = 160,
  className,
  title,
  src,
}: KaldingProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title || "Kalding goat mascot"}
        width={size}
        height={size}
        className={cn("kalding-img shrink-0 object-contain", className)}
      />
    );
  }

  const isBody = mood === "body";
  const viewBox = isBody ? "0 0 200 216" : "0 0 200 200";
  const height = isBody ? Math.round((size * 216) / 200) : size;

  const a11y: Record<string, string | boolean> = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={height}
      focusable="false"
      className={cn("kalding-svg text-foreground shrink-0", className)}
      {...a11y}
    >
      {isBody ? <BodyArt mood={mood} /> : <Head mood={mood} />}
    </svg>
  );
}
