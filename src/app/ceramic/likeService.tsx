import { act } from "react";
import { db, models, contexts } from "./orbisDB";

export const likeObject = async (objectId: string) => {
    const orbisSession = await db.getConnectedUser();
    if (!orbisSession) throw new Error("No hay sesión de usuario activa");
    const userId = orbisSession.user.did;
    try {

        const existingLike = await db
            .select()
            .context(contexts.whispy_test)
            .from(models.likes)
            .where(
                {
                    objectId: objectId,
                    userId: userId
                }
            )
            .run();

        if (existingLike.rows.length > 0) {
            const like = existingLike.rows[0]
            const updatedLike = await db.update(like.stream_id)
                .set({ active: true })
                .run();
            console.log("Post like updated successfully:", updatedLike);
        } else {
            const likeData = {
                objectId: objectId,
                userId: userId,
                active: true
            };
            const liked = await db.insert(models.likes)
                .value(likeData)
                .context(contexts.whispy_test)
                .run();
            console.log("Post liked successfully:", liked);
        }
    } catch (error) {
        console.error("Error liking post:", error);
    }
}

export const underlikeObject = async (objectId: string) => {
    const orbisSession = await db.getConnectedUser();
    if (!orbisSession) throw new Error("No hay sesión de usuario activa");
    const userId = orbisSession.user.did;
    try {
        const existingLike = await db
            .select()
            .context(contexts.whispy_test)
            .from(models.likes)
            .where(
                {
                    objectId: objectId,
                    userId: userId
                }
            )
            .run();

        if (existingLike.rows.length > 0) {
            const like = existingLike.rows[0]
            const updatedLike = await db.update(like.stream_id)
                .set({ active: false })
                .run();
            console.log("Post like updated successfully:", updatedLike);
        } else {
            console.log("No existe el like para este post");
        }
    } catch (error) {
        console.error("Error unliking post:", error);
    }
}

export const getNumberOfLikes = async (objectId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.likes)
        .where(
            {
                objectId: objectId,
                active: true
            }
        )
        .run();
    console.log("Number of likes:", rows.length);
    return rows.length;
}

export const checkLike = async (objectId: string) => {
    const orbisSession = await db.getConnectedUser();
    if (!orbisSession) throw new Error("No hay sesión de usuario activa");
    const userId = orbisSession.user.did;
    try {
        const existingLike = await db
            .select()
            .context(contexts.whispy_test)
            .from(models.likes)
            .where(
                {
                    objectId: objectId,
                    userId: userId,
                    active: true
                }
            )
            .run();

        if (existingLike.rows.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error checking like:", error);
    }
}