namespace Wexflow.Core.Db.CosmosDB
{
    public class HistoryEntry : Core.Db.HistoryEntry
    {
        [Newtonsoft.Json.JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        public override string GetDbId()
        {
            return Id;
        }
    }
}
