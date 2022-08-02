FROM denoland/deno:alpine

WORKDIR /app

# Prefer not to run as root.
USER deno

COPY . .

RUN deno cache main.ts

CMD [ "run", "--allow-env", "--allow-write", "--allow-read", "--allow-run", "--allow-net ", "main.ts" ]