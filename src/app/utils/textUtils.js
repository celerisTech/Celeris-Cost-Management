export const formatTitleCase = (text) => {
    if (!text) return text;
    return text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

export const formatSentenceCase = (text) => {
    if (!text) return text;
    // Capitalize first letter of the text
    let formatted = text.charAt(0).toUpperCase() + text.slice(1);

    // Capitalize after periods (handling space after period)
    formatted = formatted.replace(/(\. +)(\w)/g, (match, separator, char) => {
        return separator + char.toUpperCase();
    });

    // Also handle if user types period without space immediately
    formatted = formatted.replace(/(\.)(\w)/g, (match, separator, char) => {
        return separator + char.toUpperCase();
    });

    return formatted;
};
