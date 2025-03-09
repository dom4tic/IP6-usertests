export { lightenHexColor, darkenHexColor }

/**
 * Lighten a hex color by a given percentage
 * @param hex
 * @param percent
 * @returns {string}
 */
const lightenHexColor = (hex, percent) => {
    hex = hex.replace(/^#/, '');

    // extract RGB values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // increase the RGB values by the given percentage
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    // convert the new RGB values to a hex string
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Darken a hex color by a given percentage
 * @param hex
 * @param percent
 * @returns {string}
 */
const darkenHexColor = (hex, percent) => {
    hex = hex.replace(/^#/, '');

    // extract RGB values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // decrease the RGB values by the given percentage
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    // convert the new RGB values to a hex string
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
