using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace _302Redirect.Controllers
{
    public class RedirectController : ApiController
    {
        [AcceptVerbs("GET", "POST")]
        public IHttpActionResult Redirection()
        {
            //some logic
            return Redirect("https://www.google.com/");
        }
    }
}
