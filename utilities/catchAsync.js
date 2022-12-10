//-----handling error for async function (to catch our async func errors) then remove try,catch block from every RoutesHandler (make code more focused))
//make this for getAllTour and getTour only and dont refactoring the other handler to be REFRENCE

//EXPLANIN (catchAsync)
//-a)we add next to arguments to pass error to GLBOBAL ERROR handling MIDDLEWARE(IMP)
//-b)wrap the get all tour function in catchAsync  catchAsync(async (req, res, next) => ................}
//-c)when getAllTour is readed (not called by EXPRESS) catchAsync will be called using catchAsync()
//-d)and inside catchAsync we are calling fn using fn() with parameter req,res,next  fn(req, res, next)
//-e)the two proplems here(c,d) we dont need to call handler without Express(hit the route url ) and catchAsync didnt know req,res,next parameter in fn(req, res, next)
//-f)to solve this proplems we make catch Async return another function  with req,res,next objects which is gona be assigned to getAllTour
//-g)from f we return function to be callback(callback must be a faunction)
//-g)and fn dont be excuted without call getAllTour by Express route handler (callback)tourRouter.route('/').get(getAllTour)

//conclousions(getAllTour should be equal function(returned function) not be the result of calling function( fn()  )

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
