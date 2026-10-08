// Aggregates an event's ticked requirement items into a JSON array column.
const REQUIREMENTS_COLUMN = `
  COALESCE((
    SELECT json_agg(
      json_build_object('item_id', ri.item_id, 'item_name', ri.item_name, 'category', ri.category)
      ORDER BY ri.category, ri.item_name
    )
    FROM Event_Requirements er
    JOIN Requirement_Items ri ON er.item_id = ri.item_id
    WHERE er.event_id = e.event_id
  ), '[]'::json) AS requirements`;

// Turns a request value into a clean list of item ids, or null when it was not sent.
const parseRequirementIds = (value) => {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
};

const replaceRequirements = async (client, eventId, itemIds) => {
  await client.query('DELETE FROM Event_Requirements WHERE event_id = $1', [eventId]);
  if (itemIds.length > 0) {
    await client.query('INSERT INTO Event_Requirements (event_id, item_id) SELECT $1, unnest($2::int[])', [eventId, itemIds]);
  }
};

module.exports = { REQUIREMENTS_COLUMN, parseRequirementIds, replaceRequirements };
