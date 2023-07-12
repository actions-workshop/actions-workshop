import { FunctionComponent, ReactElement } from "react";

interface OctoLinkProps {
  href: string;
  title: string;
}

function sanitizeUrl(url: string) {
  // UNCOMMENT THE FOLLOWING LINES TO INTRODUCE A SECURITY VULNERABILITY FOR STEP 04: SECURITY
  // const u = decodeURI(url).trim().toLowerCase();
  // if (u.startsWith("javascript:")) {
  //   return "about:blank";
  // }
  return url;
}

const OctoLink: FunctionComponent<OctoLinkProps> = ({
  href,
  title,
}): ReactElement => {
  return <a href={sanitizeUrl(href)}>{title}</a>;
};

export { OctoLink };
