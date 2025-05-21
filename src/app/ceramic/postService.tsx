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

export const createPost = async (content:string, communityId:string, title:string) => {
    const orbisSession = await db.getConnectedUser()
    if (!orbisSession) throw new Error("No hay sesión de usuario activa")
    const userId = orbisSession.user.did
    try {
        const postData = {
            date: new Date().toISOString(),
            content: content,
            communityId: communityId,
            title: title,
        }

        const response = await db.insert(models.post)
            .value(postData)
            .context(contexts.whispy_test)
            .run()
        console.log("Post created successfully:", response)

    } catch (error) {
        console.error("Error creating post:", error)
    }
}
