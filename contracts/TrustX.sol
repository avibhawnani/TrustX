// SPDX-License-Identifier:MIT
pragma solidity ^0.8.18;
contract TrustX {
// Structure of Entities
    struct Author{
        address adrs;
        string name;
        string email;
        string contact;
        uint[] paperSubmitted;
        bool isRewarded;
        uint reward;
    } 
    struct Reviewer{
        address adrs;
        string name;
        uint[] papersReviewed;
    }
    struct Publisher{
        address adrs;
        string name;
        uint[] papersPub;
    }
    struct User{
        address adrs;
        string name;
        uint[] paperRead;
    }
    struct ScientificPaper {
        uint id;
        string title;
        string category;
        address[] authors;
        string contentHash;
        uint upvotes;
        uint downvotes;
        address[] voters;
        bool review_result;
        bool reviewed;
        bool published;
        address[] readers;
    }
// Modifier
    modifier onlyOwner(){
        require(msg.sender == owner,"You are not the Owner");
        _;
    }
// DAO details
    uint256 public paperCount;
    uint public dao_reward;
    address payable public owner;
// Mappings
    mapping(address=>Author)  private addToAuth;
    mapping(address=>Reviewer) private addToRev;
    mapping(address=>Publisher) private addToPub;
    mapping(address=>User)private addToUser; 
    mapping(uint256=> ScientificPaper) public papers;  

// Events
    event Published(address,uint);
    event Received(address, uint);
    event Reviewed(address,uint);
    event Submitted(address,uint);

// Receive Function
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
// Constructor
    constructor(){
        paperCount = 0;
        dao_reward = 0.00001 ether;
        owner = payable(msg.sender);
    }
// Functions-Add Entities
    function addAuthor(address _address,string memory _name,string memory _email,string memory _contact) onlyOwner external {
        addToAuth[_address] = Author(_address,_name,_email,_contact,new uint[](0),false,0);
    }
    function addReviewer(address _address,string memory _name) onlyOwner external {
        addToRev[_address] = Reviewer(_address,_name,new uint[](0));
    }
    function addPublisher(address _address,string memory _name) onlyOwner external {
        addToPub[_address] = Publisher(_address,_name,new uint[](0));
    }
    function addUser(address _address,string memory _name) onlyOwner external{
        addToUser[_address] = User(_address,_name,new uint[](0));
    }
// Function-SubmitPaper
    function submitPaper(string memory _title, string memory _category, string memory _contentHash, address[] memory _authors) payable external{
        require(addToAuth[msg.sender].adrs != address(0),"You are not a verified author.");
        require(msg.value == 0.001 ether,"Please pay 2 Ether to submit paper.");
        ++paperCount;
        papers[paperCount] = ScientificPaper(paperCount,_title,_category,_authors,_contentHash,0,0,new address[](0),false,false,false,new address[](0));
        addToAuth[msg.sender].isRewarded = false;
        addToAuth[msg.sender].paperSubmitted.push(paperCount);
        emit Submitted(msg.sender,paperCount);
    }
// Functions-VoteUp & VoteDown
    function voteUp(uint256 _id) external{
        ScientificPaper storage paper = papers[_id];
        require(paper.reviewed,"Paper is not reviewd, Please wait patiently!");
        require(paper.review_result,"Paper has some errors,Please rectify");
        require(paper.published == false, "Paper is already published");
        
        bool hasVoted=false;
        for(uint i=0;i<paper.voters.length;i++){
            if(paper.voters[i] == msg.sender){
                hasVoted = true;
                break;
            }
        }
        require(hasVoted == false,"Cannot Vote Twice.");
        ++paper.upvotes;
        paper.voters.push(msg.sender);
    }
    function voteDown(uint256 _id)external{
        ScientificPaper storage paper = papers[_id];
        require(paper.published==false, "The paper is already published.");
        bool hasVoted=false;
        for(uint i=0;i<paper.voters.length;i++){
            if(paper.voters[i] == msg.sender){
                hasVoted = true;
                break;
            }
        }
        require(hasVoted == false,"Cannot Vote Twice.");
        ++paper.downvotes;
        paper.voters.push(msg.sender);
    }
// Function-PublishPaper
    function publishPaper(uint _id) external{
        require(addToPub[msg.sender].adrs != address(0),"You are not a publisher.");
        ScientificPaper storage paper = papers[_id];
        require(paper.published == false,"Paper is already published");
        require(paper.reviewed,"Paper is not reviewd, Please wait patiently!");
        require(paper.review_result,"Paper has some errors,Please rectify");
        require(paper.upvotes > paper.downvotes, "The paper is not approved by the voters.");
        paper.published = true;
        addToPub[msg.sender].papersPub.push(_id);
        emit Published(msg.sender,_id);
    }
    function getRewards() external{
        Author storage auth = addToAuth[msg.sender];
        require(auth.adrs != address(0),"You are not a Verified Author.");
        require(auth.isRewarded == false,"You have been rewarded already!");
        auth.isRewarded = true;
        auth.reward = auth.paperSubmitted.length*dao_reward;
        require(address(this).balance >= auth.reward, "Insufficient balance in the contract");
        (bool success, ) = msg.sender.call{value: auth.reward}("");
        require(success, "Transfer failed.");

    }
    function getReviewed(uint256 _paperID, bool _result) external{ //by reviewer
        require(addToRev[msg.sender].adrs != address(0),"You are not a reviewer");
        ScientificPaper storage paper = papers[_paperID];
        paper.reviewed = true;
        paper.review_result = _result;
        addToRev[msg.sender].papersReviewed.push(_paperID);
        emit Reviewed(msg.sender,_paperID);
    }

    function readPaper(uint _paperID) public returns(ScientificPaper memory){
        require(addToUser[msg.sender].adrs != address(0),"You are not a verified user");
        require(papers[_paperID].published,"Error: paper not published yet.");
        addToUser[msg.sender].paperRead.push(_paperID);
        papers[_paperID].readers.push(msg.sender);
        return papers[_paperID];
    }

    function readPaper_alternate(uint _paperID) public view returns(ScientificPaper memory, address[] memory){
        return (papers[_paperID], papers[_paperID].authors);
    }

    function isPublished(uint _paperID) public view returns(bool){
        require(papers[_paperID].published,"Paper not published");
        return true;
    }

    // getters
    function getAuthor(address _acc)public view returns(Author memory){
        return addToAuth[_acc];
    }
    function getReviewer(address _acc)public view returns(Reviewer memory){
        return addToRev[_acc];
    }
    function getPublisher(address _acc)public view returns(Publisher memory){
        return addToPub[_acc];
    }
    function getUser(address _acc)public view returns(User memory){
        return addToUser[_acc];
    }
    function getDAOBalance() public view returns(uint){
        return address(this).balance;
    }
    function getPapers(address _pub, bool _isPublished) public view returns(uint[] memory){
        uint[] memory p = new uint[](paperCount);
        uint x=0;
        if(_isPublished){
            if(addToPub[msg.sender].adrs != _pub) {
                p = addToPub[_pub].papersPub;
            } else {
                for(uint i=1;i<=paperCount;i++){
                    ScientificPaper memory sp = papers[i];
                    if(sp.published == true) {
                        p[x++] = i;
                    }
                }
            }
        }
        else{
            require(addToPub[msg.sender].adrs != address(0),"You are not a publisher.");
            for(uint i=1;i<=paperCount;i++){
                ScientificPaper memory sp = papers[i];
                if(sp.published == false) {
                    p[x++] = i;
                }
            }
        }
        return p;
    }
}