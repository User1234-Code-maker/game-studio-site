import { OopsLink } from "./OopsLink";
import { SOCIAL_ICONS } from "./socialIcons";

/** Social network icons. They do not lead anywhere yet, so they open the "Oops" dialog. */
export function SocialLinks() {
  return (
    <>
      {SOCIAL_ICONS.map(({ name, path }) => (
        <OopsLink key={name} name={name} kind="page" aria-label={name}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d={path} />
          </svg>
        </OopsLink>
      ))}
    </>
  );
}
