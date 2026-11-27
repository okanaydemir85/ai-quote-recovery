
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        database: Boolean(env.DB)
      });
    }

    if (url.pathname === "/api/quotes" && request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT * FROM quotes ORDER BY created_at DESC"
      ).all();

      return Response.json(result.results);
    }

    if (url.pathname === "/api/quotes" && request.method === "POST") {
      try {
        const quote = await request.json();

        if (!quote.quote_number || !quote.company_name) {
          return Response.json(
            { error: "Quote number and company name are required" },
            { status: 400 }
          );
        }

        const result = await env.DB.prepare(`
          INSERT INTO quotes (
            quote_number, company_name, customer_name,
            customer_email, amount, currency, quote_date,
            follow_up_date, status, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          quote.quote_number,
          quote.company_name,
          quote.customer_name || null,
          quote.customer_email || null,
          Number(quote.amount) || 0,
          quote.currency || "EUR",
          quote.quote_date || null,
          quote.follow_up_date || null,
          quote.status || "pending",
          quote.notes || null
        ).run();

        return Response.json({
          success: true,
          id: result.meta.last_row_id
        });
      } catch (error) {
        return Response.json(
          { error: "Could not save quote" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
