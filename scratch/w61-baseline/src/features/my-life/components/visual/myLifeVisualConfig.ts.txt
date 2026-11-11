/** Optional visual-only configuration for the MyLife home. Keep empty until a
 * family background image is selected by a future appearance setting.
 */
export interface MyLifeVisualConfig {
  heroBackgroundImage?: string;
  heroBackgroundPosition?: string;
}

export const myLifeVisualConfig: MyLifeVisualConfig = {
  heroBackgroundImage: undefined,
  heroBackgroundPosition: 'center',
};
