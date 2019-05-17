export default function({route, redirect}) {
    const match = route.path.match(/\/M[xpt][0-9a-fA-F]+(\/|$)/);

    if (match) {
        const hash = match[0].replace(/\//g, '');
        const prefix = hash.substr(0, 2);
        const hashLowercase = prefix + hash.substr(2).toLowerCase();

        if (hash !== hashLowercase) {
            // keep slashes from match and replace hash with lowercase version
            const hashLowercaseSlash = match[0].replace(hash, hashLowercase);
            return redirect(route.path.replace(match[0], hashLowercaseSlash));
        }
    }
}
