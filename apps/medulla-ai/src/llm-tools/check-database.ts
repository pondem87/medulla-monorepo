import { Client } from "pg"

export async function checkTableExists(tableName: string, connString: string): Promise<boolean> {
    const client = new Client({
        connectionString: connString
    })

    try {
        await client.connect();

        // Query to check if the table exists
        const res = await client.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            ) AS table_exists;
        `, [tableName]);

        if (res.rows[0].table_exists) {
            console.log("Table has been found")
            return true
        } else {
            console.log("Table not found")
            return false
        }
    } catch (err) {
        console.log('Error checking table existence:', err);
        return false
    } finally {
        await client.end();
    }
}
