using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Bot.Connector;

namespace _302Redirect
{
    public class Utility
    {
        public static Attachment GetHeroCard(List<CardAction> buttons)
        {
            var heroCard = new HeroCard();
            heroCard.Buttons = buttons;
            return heroCard.ToAttachment();

        }

        public static List<CardAction> GetButtons()
        {
            List<CardAction> buttons = new List<CardAction>();

            CardAction ca1 = new CardAction()
            {
                Title = "Open URL",
                Type = ActionTypes.OpenUrl,
                Text = "Open URL",
                Value = "https://34878889.ngrok.io/api/redirect"
            };
            buttons.Add(ca1);

            return buttons;
        }
    }
}