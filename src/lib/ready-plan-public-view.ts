export function generatePublicPlanView(containerElement: Element): HTMLElement {
  if (!(containerElement instanceof Element)) {
    throw new Error("generatePublicPlanView requires a valid DOM element.");
  }

  // Deep clone is required here so the full preview tree is copied.
  const clone = containerElement.cloneNode(true) as HTMLElement;

  clone
    .querySelectorAll(
      [
        ".admin-control",
        ".edit-button",
        ".delete-button",
        ".control-buttons",
        "[data-admin]",
        "input[type='file']",
      ].join(","),
    )
    .forEach((node) => node.remove());

  clone.querySelectorAll("button").forEach((button) => {
    const replacement = document.createElement("div");
    replacement.className = button.className;
    replacement.innerHTML = button.innerHTML;
    replacement.setAttribute("role", "presentation");
    copyDataAttributes(button, replacement);
    button.replaceWith(replacement);
  });

  clone.querySelectorAll("textarea").forEach((textarea) => {
    const replacement = document.createElement("div");
    replacement.className = textarea.className;
    replacement.textContent = textarea.value || textarea.placeholder || "";
    replacement.style.whiteSpace = "pre-wrap";
    copyDataAttributes(textarea, replacement);
    textarea.replaceWith(replacement);
  });

  clone.querySelectorAll("select").forEach((select) => {
    const replacement = document.createElement("div");
    replacement.className = select.className;
    replacement.textContent = select.selectedOptions[0]?.textContent?.trim() || "";
    copyDataAttributes(select, replacement);
    select.replaceWith(replacement);
  });

  clone.querySelectorAll("input").forEach((input) => {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    if (type === "hidden") {
      input.remove();
      return;
    }

    if (type === "checkbox" || type === "radio") {
      const wrapper = input.closest("label");
      if (wrapper) {
        wrapper.remove();
      } else {
        input.remove();
      }
      return;
    }

    const replacement = document.createElement("div");
    replacement.className = input.className;
    replacement.textContent = input.value || input.placeholder || "";
    copyDataAttributes(input, replacement);
    input.replaceWith(replacement);
  });

  clone.querySelectorAll("[contenteditable]").forEach((node) => {
    node.removeAttribute("contenteditable");
  });

  return clone;
}

export function generatePublicPlanHtml(containerElement: Element) {
  return generatePublicPlanView(containerElement).outerHTML;
}

function copyDataAttributes(source: Element, target: Element) {
  for (const attribute of source.getAttributeNames()) {
    if (attribute.startsWith("data-") && source.getAttribute(attribute) !== null) {
      target.setAttribute(attribute, source.getAttribute(attribute) as string);
    }
  }
}
