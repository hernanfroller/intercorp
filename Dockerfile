FROM node:alpine

WORKDIR '/app'

COPY package.json .
RUN npm install
RUN npm install apidoc -g
COPY . .
RUN apidoc -e node_modules/ -o docs/ -t templates/apidocs/
EXPOSE 3000
CMD ["npm","start"]
