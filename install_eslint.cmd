echo {"name": "project_name","version": "1.0.0","description": "project description","main": "index.js","scripts": {"test": "echo \"Error: no test specified\" && exit 1" },"author": "","license": "ISC","eslint": "eslint --ignore-path .gitignore .","dependencies": {}} > package.json
call npm install eslint --save-dev
call node node_modules\eslint\bin\eslint.js --init

