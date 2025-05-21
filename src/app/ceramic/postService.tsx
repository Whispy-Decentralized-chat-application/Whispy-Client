import { contexts, db, models } from "./orbisDB"

export const retrieveCommunityPosts = async (communityId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.post)
        .where(
            {
                communityId: communityId
            }
        )
        .run()
    console.log("Retrieved posts:", rows)
    return rows
}