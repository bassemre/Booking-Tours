//OOP
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
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

    return this;
  }

  // 2)Sorting

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //to convert from (price,ratingsAverage from url ) to (price ratingsAverage)(return string)
      //to can be parsed inside sort method
      //add minus to be sorted in decreasing mood
      this.query = this.query.sort(sortBy); //prevents only to changing the actual value of reassigning the variable but can changing the different properties
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

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

    return this;
  }
}

module.exports = APIFeatures;
