const FILE_EXTENSIONS_BY_TYPE_MAP = {
    'image/jpeg'    : 'jpg',
    'image/pjpeg'   : 'jpg',
    'image/gif'     : 'gif',
    'image/png'     : 'png',
    'image/webp'    : 'webp',
    'image/avif'    : 'avif',
};

/**
 * 
 * @param {File} file 
 * @returns {string}
 */
export function getExtensionFromFile(file) {
    return FILE_EXTENSIONS_BY_TYPE_MAP[file.type] || null;
    // switch(file.type) {
    //     case 'image/jpeg':
    //     case 'image/pjpeg':
    //         return 'jpg';

    //     case 'image/gif':
    //         return 'gif';

    //     case 'image/png':
    //         return 'png';

    //     case 'image/webp':
    //         return 'webp';

    //     case 'image/avif':
    //         return 'avif';

    //     default:
    //         return null;
    // }
}