/**
 * ComponentRegistry.ts — platform/component/
 *
 * Purpose:
 *   Centralizes Custom Element registration to prevent the
 *   customElements.define() "already-defined" crash. Calling define() twice
 *   with the same tag name throws, which is a real risk across 50+ pages where
 *   shared components may be imported and registered independently.
 *
 * Usage rule (no exceptions):
 *   EVERY Custom Element class file in components/, pages/, and layouts/ must
 *   register at the bottom of its own file via:
 *
 *     ComponentRegistry.register('my-tag', MyElement);
 *
 *   NEVER call customElements.define() directly. This protection must be
 *   applied consistently everywhere, with zero exceptions.
 */
export class ComponentRegistry {
  private static readonly registeredTags: Set<string> = new Set();

  /**
   * Registers a Custom Element unless its tag is already registered.
   * Duplicate registrations log a development-time warning (not an error) and
   * are skipped, so the app never crashes on a re-import.
   */
  public static register(tagName: string, componentClass: CustomElementConstructor): void {
    if (ComponentRegistry.registeredTags.has(tagName)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ComponentRegistry] Custom Element "${tagName}" is already registered. ` +
          'Skipping duplicate registration.',
      );
      return;
    }
    customElements.define(tagName, componentClass);
    ComponentRegistry.registeredTags.add(tagName);
  }
}