module.exports.successResponse = ( data, metadata ) => {
  
    return {
        status: 'sucess',
        data,
        metadata
    }
}

module.exports.errorResponse = ( data, metadata ) => {
    return {
        status: 'error',
        data,
        metadata
    }
}