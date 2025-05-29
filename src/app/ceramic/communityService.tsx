import { col } from "framer-motion/client";
import { contexts, db, models } from "./orbisDB";
import { catchError } from "@useorbis/db-sdk/util";

export const retrieveMyCommunities = async () => {
    const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;

    const communityModel = models.community;
    const communityMembershipModel = models.community_membership;
    const { columns, rows } = await db
    .select()
    .context(contexts.whispy_test)
    .raw(
        `
        SELECT c.*
        FROM "${communityModel}" AS c
        JOIN "${communityMembershipModel}" AS cm
            ON cm."communityId"   = c.stream_id
        WHERE cm."userId" = $1 AND cm.active = true;

        `,
        [userId]
    )
    .run();

    console.log("Community para test_user:", rows);
    return rows;

};


export const joinCommunity = async (communityId: string) => {
    try {
        const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;
        console.log("User ID:", userId);
        await db.getConnectedUser();

        const community_membershipData = {
            communityId: communityId,
            userId: userId,
            active: true
        };

        const existingCM = await db
            .select()
            .context(contexts.whispy_test)
            .from(models.community_membership)
            .where(
                {
                    communityId: communityId,
                    userId: userId
                }
            )
            .run();

        if (existingCM.rows.length > 0) {
            const cm = existingCM.rows[0]
            const updatedMembership = await db.update(cm.stream_id)
                .set({ active: true })
                .run();
            console.log("Community membership updated successfully:", updatedMembership);
        } else {
            const insertedMembership = await db.insert(models.community_membership)
                .value(community_membershipData)
                .context(contexts.whispy_test)
                .run();
            console.log("Community membership created successfully:", insertedMembership);
        }

    } catch (error) {
        console.error("Error creating community membership:", error);
    }
}

export const leaveCommunity = async (communityId: string) => {
    try {
        const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;
        console.log("User ID:", userId);
        await db.getConnectedUser();
        ;
        const existingCM = await db
            .select()
            .context(contexts.whispy_test)
            .from(models.community_membership)
            .where(
                {
                    communityId: communityId,
                    userId: userId
                }
            )
            .run();


            if (existingCM.rows.length > 0) {

                const cm = existingCM.rows[0]

                const updatedMembership = await db.update(cm.stream_id)
                .set({active: false})
                .run();
                console.log("Community membership updated successfully:", updatedMembership);
            
                
            }

    } catch (error) {
        console.error("Error updating community membership:", error);
    }
}

export const createCommunity = async (communityName: string, description: string) => {
    try {
        const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;
        console.log("User ID:", userId);
        await db.getConnectedUser();

        const communityData = {
            name: communityName,
            description: description,
            creator: userId,
            admins: [userId]
        };

        const insertedCommunity = await db.insert(models.community)
            .value(communityData)
            .context(contexts.whispy_test)
            .run();
        console.log("Community created successfully:", insertedCommunity);

        const community_membershipData = {
            communityId: insertedCommunity.id,
            userId: userId,
            active: true
        };
        const insertedMembership = await db.insert(models.community_membership)
            .value(community_membershipData)
            .context(contexts.whispy_test)
            .run();
        console.log("Community membership created successfully:", insertedMembership);

    } catch (error) {
        console.error("Error creating community:", error);
    }
}

export const searchCommunities = async (searchTerm: string) => {
    const pattern = `%${searchTerm}%`;
    const { columns, rows } = await db
      .select()
      .context(contexts.whispy_test)
      .raw(
        `
        SELECT *
        FROM "${models.community}"
        WHERE name ILIKE $1
          OR description ILIKE $1;
        `,
        [pattern]
      )
      .run();

    return rows;
}

export const getCommunityById = async (communityId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.community)
        .where(
            {
                stream_id: communityId
            }
        )
        .run();
    console.log("Retrieved community:", rows);
    return rows[0];
}

export const checkJoined = async (communityId: string) => {
    const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;
    console.log("User ID:", userId);
    await db.getConnectedUser();

    const existingCM = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.community_membership)
        .where(
            {
                communityId: communityId,
                userId: userId
            }
        )
        .run();

    console.log("Existing community membership:", existingCM);

    if (!existingCM || !existingCM.rows || existingCM.rows.length === 0) {
        console.log("No membership found for this community.");
        return false;
    }

    return existingCM.rows ? existingCM.rows[0].active : false;
}