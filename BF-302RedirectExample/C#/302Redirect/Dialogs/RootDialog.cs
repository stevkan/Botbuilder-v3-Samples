using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Connector;

namespace _302Redirect.Dialogs
{
    [Serializable]
    public class RootDialog : IDialog<object>
    {
        public Task StartAsync(IDialogContext context)
        {
            context.Wait(MessageReceivedAsync);

            return Task.CompletedTask;
        }

        private async Task MessageReceivedAsync(IDialogContext context, IAwaitable<object> result)
        {
            var activity = await result as Activity;

            List<CardAction> buttons = new List<CardAction>();

            CardAction ca1 = new CardAction()
            {
                Title = "Open URL",
                Type = ActionTypes.OpenUrl,
                Text = "Open URL",
                Value = "https://f450a257.ngrok.io/api/redirect"
            };
           
            buttons.Add(ca1);
            var heroCard = new HeroCard();
            heroCard.Text = "Open URL";
            heroCard.Buttons = buttons;

            activity = activity.CreateReply();
            activity.Attachments.Add(heroCard.ToAttachment());


            await context.PostAsync(activity);

            context.Wait(MessageReceivedAsync);
        }
    }
}