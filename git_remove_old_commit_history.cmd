git tag -d v1.0.0
git push --delete origin v1.0.0
git checkout --orphan temp_branch
git add -A
git commit -am "initial release"
git branch -D master
git branch -m master
git push --delete origin v1.0.0
git push -f origin master