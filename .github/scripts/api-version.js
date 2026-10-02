// Pin the GitHub REST API version for an Octokit client (default 2022-11-28 is deprecated, end of support 2028-03-10).
// Breaking changes of 2026-03-10: https://docs.github.com/en/rest/about-the-rest-api/breaking-changes
const API_VERSION = '2026-03-10';

module.exports = function pinApiVersion(octokit) {
    octokit.hook.before('request', (options) => {
        options.headers['x-github-api-version'] = API_VERSION;
    });
    return octokit;
};
