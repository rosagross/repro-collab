module.exports = async function ({ github, context, core, env }) {
    const [owner, repo] = process.env.FORK_REPO.split('/');

    const errors = [];

    // Check if a project (Projects v2) is linked to the fork repository.
    // The classic Projects REST API has been sunset, so GraphQL is required.
    // Only public projects are visible to our token, hence the reminder below.
    let projectExists = false;
    let projectCount = 0;

    try {
        const result = await github.graphql(
            `query($owner: String!, $repo: String!) {
                repository(owner: $owner, name: $repo) {
                    projectsV2(first: 20) { totalCount nodes { title public closed } }
                }
            }`,
            { owner, repo }
        );

        const projects = result.repository.projectsV2.nodes.filter(p => !p.closed);
        projectCount = projects.length;
        projectExists = projectCount > 0;

        if (!projectExists) {
            errors.push('❌ No open, public GitHub Project linked to your repository was found. Create it from the **Projects** tab of your fork and make sure its visibility is **Public** (project **Settings** → **Visibility**).');
        }
    } catch (error) {
        errors.push(`❌ Error checking for projects: ${error.message}`);
    }

    // Check for at least one issue with a label
    let hasLabeledIssue = false;
    try {
        const { data: issues } = await github.rest.issues.listForRepo({
            owner,
            repo,
            state: 'all',
            per_page: 100
        });

        hasLabeledIssue = issues.some(issue => issue.labels && issue.labels.length > 0);

        if (!hasLabeledIssue) {
            errors.push('❌ No issues with labels found. Please add labels to at least one issue.');
        }
    } catch (error) {
        errors.push(`❌ Error checking for labeled issues: ${error.message}`);
    }

    // Check for at least one issue with an assignee
    let hasAssignedIssue = false;
    try {
        const { data: issues } = await github.rest.issues.listForRepo({
            owner,
            repo,
            state: 'all',
            per_page: 100
        });

        hasAssignedIssue = issues.some(issue => issue.assignees && issue.assignees.length > 0);

        if (!hasAssignedIssue) {
            errors.push('❌ No issues with assignees found. Please assign at least one issue to yourself or your partner.');
        }
    } catch (error) {
        errors.push(`❌ Error checking for assigned issues: ${error.message}`);
    }

    // If there are any errors, report them and fail
    if (errors.length > 0) {
        await github.rest.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.issue.number,
            body: [
                '**Milestone 14 not complete yet!**',
                '',
                ...errors,
                '',
                'Please complete the tasks as described in the milestone instructions and try again.'
            ].join('\n')
        });
        return;
    }

    // Mark milestone complete
    const updatedBody14 = context.payload.issue.body
    .replace(/^(\s*-\s*\[)\s\](\s*14\..*)$/m, '$1x]$2');

    await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: updatedBody14,
        state: 'open'
    });

    // Success message
    const milestone14BodyLines = [
        '✅ **Milestone 14 complete!**',
        '',
        `Great work! We found:`,
        `- ${projectCount} project${projectCount > 1 ? 's' : ''} in your repository`,
        `- Issues with labels ✓`,
        `- Issues with assignees ✓`,
        '',
        'You now understand how to use GitHub Projects, labels, and assignments to organize and track collaborative work.',
        '',
        '**Key insight:** Projects, labels, and assignments provide a visual way to manage issues and PRs, clarify responsibilities, and track progress across your workflow.'
    ];
    await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: milestone14BodyLines.join('\n')
    });
}
