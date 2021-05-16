FROM node:15
WORKDIR /app
COPY package.json .
 
# pass option "--only=production", to prevent dev dependencies to be installed for prod build
# RUN npm install

# ARG should be passed from docker-compose file
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi
COPY . ./
ENV PORT 3000
EXPOSE $PORT 
# CMD ["npm", "run", "dev"] # Command run in development mode, in docker-compose.dev.yml we can dynamically override this
CMD ["node", "index.js"]