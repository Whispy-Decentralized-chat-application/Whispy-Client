import { debug } from "console";
import { db, models, contexts } from "./orbisDB";

export const reportObject = async (objectId: string, reason: string) => {
    const orbisSession = await db.getConnectedUser();
    if (!orbisSession) throw new Error("No hay sesión de usuario activa");
    const user:any = localStorage.getItem("orbis:user");
    const userId = user ? JSON.parse(user).stream_id : null;
    try {
        debugger;
        const reportData = {
            reportedId: objectId,
            reason: reason,
            reporterId: userId,
            date: new Date().toISOString(),
        };

        const response = await db.insert(models.report)
            .value(reportData)
            .context(contexts.whispy_test)
            .run();
            

        console.log("Report created successfully:", response);
    } catch (error) {
        console.error("Error creating report:", error);
    }
}