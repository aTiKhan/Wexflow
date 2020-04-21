namespace Wexflow.Core.Db.CosmosDB
{
    public class User : Core.Db.User
    {
        [Newtonsoft.Json.JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        public override string GetId()
        {
            return Id;
        }
    }
}
