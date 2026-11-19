import { useEffect } from "react";

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

/** Sets the tab title and description for the current page and language. */
export function useDocumentHead(title: string, description?: string): void {
  useEffect(() => {
    document.title = title;
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
  }, [title, description]);
}
