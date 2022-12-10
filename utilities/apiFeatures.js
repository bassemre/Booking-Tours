//OOP
class APIFeatures {
  //--build constructor
  //at any point we pass new APIFeatures(A,B) this two parameters A,B passes inside constructor function as parameters
  constructor(
    query,
    queryString
  ) /*query, querystring(arguments of constructor function*/ {
    this.query = query; //we put property inside APIfeatures called (query) equals the query parameter
    this.queryString = queryString; //we put property inside APIfeatures called (querystring) equals the query parameter
  }

  // 1)Filter method inside class

  filter() {
    // 1A) Filtering
    const queryObj = { ...this.queryString }; //from ES6 we use {...} to simply create new object(queryObj) out of (req.query)
    const excludeFilelds = ['page', 'sort', 'limit', 'fields']; //ignore this query from find({})
    excludeFilelds.forEach((el) => delete queryObj[el]); //make queryObj= req.query-excludeFilelds (CHECK THAT BY console.log(req.query, queryObj);
    // 1B)Advanced Filtering
    //---------in johnas videos using mongoose section-----------
    this.query = this.query.find(queryObj); //return array of  all documents in this collection and formated it into javascript objects
    //documents will be stored in this.query
    //find({}) make filter to model by objects ex==> find({difficulty:'easy'}) when we pass in url (the query string)=(?difficulty=easy)
    //query sring must included the field name and value in database to get filtering
    //(req.query={difficulty:'easy'}) check that by console.log(req.query);
    return this; //to can chain other mehods like sort() by return the main object
  }

  // 2)Sorting

  // sort by "field" ascending and "test" descending
  //query.sort({ field: 'asc', test: -1 });
  // equivalent
  // query.sort('field -test');
  //--sort by price from low to high(increasing)
  //to make it in decreasing order (inside query string put minus sign)(?sort=-price)
  sort() {
    if (this.queryString.sort) {
      //if we have two tour have same price we must have second critria
      //(for ex) in mongoose  sort('price ratingsAverage ')
      const sortBy = this.queryString.sort.split(',').join(' '); //to convert from (price,ratingsAverage from url ) to (price ratingsAverage)(return string)
      //to can be parsed inside sort method
      //add minus to be sorted in decreasing mood
      this.query = this.query.sort(sortBy); //prevents only to changing the actual value of reassigning the variable but can changing the different properties
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 3)Field limiting (to request some of the fields by the client)
  //query.select('field1 field2');//select field1 and field2 only from properties
  //query.select('-field1 -field2');//by adding - (not selected field1 & field2 ) and showing another fields (properties)
  // include a and b, exclude other fields
  //query.select('a b');
  // Equivalent syntaxes:
  //query.select(['a', 'b']);
  //query.select({ a: 1, b: 1 });
  limitingFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      console.log(fields);
    } else {
      this.query = this.query.select('-__v'); //all fields excluding __v
      //by adding select:false in our schema we will hide this field from clients
    }
    return this;
  }

  // 4)pagination
  //-----in query string(?page=pagenumber&limit=limit documents per page)
  paginate() {
    const page = this.queryString.page * 1 || 1; //(by default page number 1)
    const limit = this.queryString.limit * 1 || 100; //(by default 100 documents per page)(number of results per page)
    const skip = (page - 1) * limit; // for ex (page=3 limit=10) (skip first 20 documents )( 21-30 page 3)(skip= number of document per page)
    //---EX--in query string(?page=2&limit=10)
    //1-10 page1 , 11-20 page2 , 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    /* if (this.queryString.page) {
        const numTours = await Tour.countDocuments();
        if (skip >= numTours) throw new Error('this page dosent exist'); //imm go to catch block in try
      }*/
    return this;
  }
}

module.exports = APIFeatures;
