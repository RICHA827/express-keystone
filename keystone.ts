import { config } from "@keystone-6/core";
import { lists } from "./schema";
import { TypeInfo } from ".keystone/types";

export default config<TypeInfo>({
  db: {
    provider: "sqlite",
    url: "file:./keystone.db",
  },
  server: {
    extendExpressApp: (app, commonContext) => {
      app.get("/rest/posts", async (req, res) => {
        try {
          const context = await commonContext.withRequest(req, res);
          const isDraft = req.query?.draft === "1";
          const posts = await context.query.Post.findMany({
            where: {
              draft: {
                equals: isDraft,
              },
            },
            query: `
              id
              title
              content
            `,
          });

          res.json(posts);
        } catch (error) {
          console.error("Error fetching posts:", error);
          res
            .status(500)
            .json({ error: "An error occurred while fetching posts" });
        }
      });
    },

    extendHttpServer: (server, commonContext) => {
      server.on("request", async (req, res) => {
        if (!req.url?.startsWith("/rest/posts/")) return;

        try {
          const context = await commonContext.withRequest(req, res);
          const postId = req.url.slice("/rest/posts/".length);
          const post = await context.query.Post.findOne({
            where: { id: postId },
            query: `
              id
              title
              content
              draft
            `,
          });

          if (!post) {
            res.writeHead(404).end(JSON.stringify({ error: "Post not found" }));
          } else {
            res.writeHead(200).end(JSON.stringify(post));
          }
        } catch (error) {
          console.error("Error fetching post:", error);
          res
            .writeHead(500)
            .end(
              JSON.stringify({
                error: "An error occurred while fetching the post",
              })
            );
        }
      });
    },
  },
  lists,
});
