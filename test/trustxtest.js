const {expect} =  require("chai");
const { ethers } = require("hardhat");
const testCase = require('mocha').describe;

testCase("Deployment",function(){
    let Contract;
    let contract;
    let Owner;
    let auth1;
    let pub1;
    let rev1;
    let u1;
    beforeEach(async function(){
        Contract = await ethers.getContractFactory("TrustX");
        [Owner,auth1,pub1,rev1,u1] = await ethers.getSigners();
        contract= await Contract.deploy();
    });

    testCase("TrustX Contract",function(){

        it("Owner Check",async function(){
            console.log("Owner Address : ",Owner.address);
            const ownerInfo = await contract.owner();
            console.log("Code Official Address : ",ownerInfo);
            expect(await Owner.address).to.equal(ownerInfo);
        });

        it("Initialization of Paper Count & DAO Reward Check",async function(){
            
            const pc = await contract.paperCount();
            const dr = await contract.dao_reward();
            const bal = 0;
            const dbal = ethers.utils.parseEther("0.00001");
            console.log("Paper Count & DAO_reward : ",pc,dr);
            expect(await pc.toString()).to.equal(bal.toString());
            expect(await dr.toString()).to.equal(dbal.toString());
        });

        it("Getters and Setters for Entities",async function(){
            // adding Author1
            await contract.addAuthor(auth1.address,"AviB","avib@gmail.com","123456789");
            console.log("Author1 details: ",await contract.getAuthor(auth1.address)); 
            console.log("Author Balance : ",await ethers.provider.getBalance(auth1.address));
            // adding Publisher1
            await contract.addPublisher(pub1.address,"Pub1");
            console.log("Publisher1 details: ",await contract.getPublisher(pub1.address));
            // adding Reviewer1
            await contract.addReviewer(rev1.address,"Rev1");
            console.log("Reviewer1 details: ",await contract.getReviewer(rev1.address));
            // adding User1
            await contract.addUser(u1.address,"User1");
            console.log("User1 details: ",await contract.getUser(u1.address));

        });

        it("Submit Paper - Author",async function(){
            await contract.addAuthor(auth1.address,"AviB","avib@gmail.com","123456789");
            const title = "Cattle Supply Chain using Blockchain Technology";
            const category = "Blockchain";
            const contentHash = "ipfs:xy5hk9a1jld23jc97cd34cv99";
            const pay = {value: ethers.utils.parseEther("2")}
            await contract.connect(auth1).submitPaper(title,category,contentHash,[auth1.address],pay);
            console.log("Paper details: ",await contract.papers(1));
            const bal = await contract.getDAOBalance();
            console.log("DAO Balance: ",bal);
        });
        
        it("Review Paper - Reviwer",async function(){
            await contract.addAuthor(auth1.address,"AviB","avib@gmail.com","123456789");
            await contract.addReviewer(rev1.address,"Rev1");
            const title = "Cattle Supply Chain using Blockchain Technology";
            const category = "Blockchain";
            const contentHash = "ipfs:xy5hk9a1jld23jc97cd34cv99";
            const pay = {value: ethers.utils.parseEther("2")}
            await contract.connect(auth1).submitPaper(title,category,contentHash,[auth1.address],pay);
            console.log("Paper details: ",await contract.papers(1));
            await contract.connect(rev1).getReviewed(1,true);
            console.log("Paper details: ",await contract.papers(1));
        });

        it("Voting for paperID-1",async function(){
            await contract.addAuthor(auth1.address,"AviB","avib@gmail.com","123456789");
            await contract.addReviewer(rev1.address,"Rev1");
            await contract.addUser(u1.address,"User1");
            const title = "Cattle Supply Chain using Blockchain Technology";
            const category = "Blockchain";
            const contentHash = "ipfs:xy5hk9a1jld23jc97cd34cv99";
            const pay = {value: ethers.utils.parseEther("2")}
            await contract.connect(auth1).submitPaper(title,category,contentHash,[auth1.address],pay);
            console.log("Paper details: ",await contract.papers(1));
            await contract.connect(rev1).getReviewed(1,true);
            await contract.connect(u1).voteUp(1);
            await contract.connect(auth1).voteUp(1);
            await contract.connect(rev1).voteDown(1);
            console.log("Paper details: ",await contract.papers(1));
        });

        it("Publish Paper - 1 & Push rewards to Auth1",async function(){
            await contract.addAuthor(auth1.address,"AviB","avib@gmail.com","123456789");
            await contract.addPublisher(pub1.address,"Pub1");
            await contract.addReviewer(rev1.address,"Rev1");
            await contract.addUser(u1.address,"User1");
            const title = "Cattle Supply Chain using Blockchain Technology";
            const category = "Blockchain";
            const contentHash = "ipfs:xy5hk9a1jld23jc97cd34cv99";
            const pay = {value: ethers.utils.parseEther("2")}
            await contract.connect(auth1).submitPaper(title,category,contentHash,[auth1.address],pay);
            await contract.connect(rev1).getReviewed(1,true);
            await contract.connect(u1).voteUp(1);
            await contract.connect(auth1).voteUp(1);
            await contract.connect(rev1).voteDown(1);
            await contract.connect(pub1).publishPaper(1);
            console.log("Paper details: ",await contract.papers(1));
            const isPub = await contract.isPublished(1);
            console.log("is Paper Published : ",isPub);
            expect(isPub).to.equal(true);

            // Claim Rewards
            const beforeEBal = await ethers.provider.getBalance(auth1.address);
            const beforeDBal = await contract.getDAOBalance();
            console.log("Before DAO Balance: ",ethers.utils.formatEther(beforeDBal));
            console.log("Before Author1 Balance: ",ethers.utils.formatEther(beforeEBal));

            await contract.connect(auth1).getRewards();

            const afterEBal = await ethers.provider.getBalance(auth1.address);
            const afterDBal = await contract.getDAOBalance();
            
            console.log("After DAO Balance: ",ethers.utils.formatEther(afterDBal));
            console.log("After Author1 Balance: ",ethers.utils.formatEther(afterEBal));

        })
    });
});
