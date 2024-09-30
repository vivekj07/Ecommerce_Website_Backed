
class ErrorHandler extends Error {
    public code: number | undefined;
    constructor(message: string, public statuscode: number, code?: number) {
        super(message);
        this.statuscode = statuscode
        this.code = code;
    }

}
export default ErrorHandler