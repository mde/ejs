### Introduction

After you run the commands specified at `http://git-doc.com/setup` a basic setup is created for
you. Including this file a few other files were created for you, so you can have detailed
information about your repository available to everyone.

### gitdoc.json

There are a few fields in this file that make it easy to give your viewers extra details about
the community, as well as the domain for premium repos, and the sections for your documentation.

#### googleGroup

This is a field you can use to give your viewers a link to your google group. Just set the field
to the name of your google group, and we'll create the link. It isn't required though, you can
leave it out safely.

#### irc

This is a field you can use to give your viewers the details to join your irc channel. To use it
set an object with two fields. One of the fields is `server`, this is the server address for the
irc network(e.g. irc.freenode.net for the freenode network). The next is the `channel` field,
this tells the viewers the specific channel for your community. The channel requires you to
include the prefix character though(e.g. #, &, +, !), since there are multiple.

#### domain

This is a field you can use if your repository is premium. It tells us the name of the domain
for your repo, so we can get your repo if we detect a custom domain. You can ignore it, or just
set a placeholder if it's not premium.

#### sections

This is a field to tell git-doc the documentation sections to find. This field is an array, it
should be the files you want to include in the `support/docs` directory. It is also used for the
navigation on the documentation page, so it is a good idea to make them readable.

### changelog.md

This file is just a markdown file displaying the changelog for your repository. For details on
the markdown, view the default documentation created. This file can be safely ignored if you don't
want to include a changelog page.

### faq.md

This file is just a markdown file displaying the frequently asked questions for your repository.
For details on the markdown, view the default documentation created. This file can be safely
ignored if you don't want to include a faq page.

### tutorial.md

This file is just a markdown file displaying the tutorial for your repository. For details on the
markdown, view the default documentation created. This file can be safely ignored if you don't
want to include a tutorial page.

### styles.css

This file is used when your repository is premium to display custom layouts for your viewers. It
can be safely ignored, or just as a place holder if the repo is not premium.

### docs/

This directory is used to hold the documentation markdown files for the documentation page. To
tell git-doc what documentation files you want to use include them in the `sections` field in the
`support/gitdoc.json` file mentioned above.
