const url = "https://kitmwxfwwujygcmdjngm.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdG13eGZ3d3VqeWdjbWRqbmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNTYsImV4cCI6MjA5NDA5NzA1Nn0.Er_7LFPyup8LjcFaGuIAKMHcIVzJfbU-ihVs_r-IkXE";

async function run() {
  console.log("=== DIAGNOSTIC START ===");
  console.log("Fetching programacao_eventos...");
  const res1 = await fetch(`${url}/rest/v1/programacao_eventos?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const data1 = await res1.json();
  console.log("programacao_eventos count:", data1.length);
  console.log("programacao_eventos sample:", JSON.stringify(data1, null, 2));

  console.log("\nFetching agenda_eventos...");
  const res2 = await fetch(`${url}/rest/v1/agenda_eventos?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const data2 = await res2.json();
  console.log("agenda_eventos count:", data2.length);
  console.log("agenda_eventos sample:", JSON.stringify(data2, null, 2));
}

run().catch(console.error);
